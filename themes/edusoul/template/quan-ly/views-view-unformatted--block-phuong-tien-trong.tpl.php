<div class="row mt-3 justify-content-end">
    <div class="col-md-3">
        <select class="form-control" id="phuong-tien-cho-yeu-cau">
            <option value="">-- Chọn Phương tiện --</option>
            <?php foreach ($rows as $id => $row): ?>
                <?php $contentArr = explode('{{}}', $row); ?>
                <option value="<?=strip_tags($contentArr[0])?>">
                    <?php print implode(' - ', array_filter([$contentArr[1], $contentArr[2] ?? "(Chưa có lái xe)"])); ?>
                </option>
            <?php endforeach; ?>
<!--            <option value="Xe ngoài">Xe ngoài</option>-->
        </select>
    </div>
    <div class="col-md-3 d-grid">
        <a href="#" class="btn btn-primary waves-effect waves-light btn-luu-chon-yeu-cau">Lưu yêu cầu đã chọn và xếp xe</a>
    </div>
</div>
